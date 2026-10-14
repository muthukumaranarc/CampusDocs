package com.muthu.CampusDocus.service;

import com.google.api.client.auth.oauth2.ClientParametersAuthentication;
import com.google.api.client.auth.oauth2.RefreshTokenRequest;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.auth.oauth2.TokenResponseException;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.muthu.CampusDocus.dto.DriveStatusResponse;
import com.muthu.CampusDocus.exception.DriveException;
import com.muthu.CampusDocus.exception.ResourceNotFoundException;
import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.model.UserGoogleCredential;
import com.muthu.CampusDocus.repository.UserGoogleCredentialRepository;
import com.muthu.CampusDocus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.http.InputStreamContent;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

@Service
public class GoogleDriveService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleDriveService.class);
    private static final String FOLDER_NAME = "CampusDocs";
    private static final String FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

    private final UserRepository userRepository;
    private final UserGoogleCredentialRepository credentialRepository;
    private final HttpTransport httpTransport;
    private final JsonFactory jsonFactory;

    @Value("${spring.security.oauth2.client.registration.google-drive.client-id:${spring.security.oauth2.client.registration.google.client-id:}}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google-drive.client-secret:${spring.security.oauth2.client.registration.google.client-secret:}}")
    private String clientSecret;

    public GoogleDriveService(UserRepository userRepository,
                              UserGoogleCredentialRepository credentialRepository,
                              HttpTransport httpTransport,
                              @Qualifier("googleJsonFactory") JsonFactory jsonFactory) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.httpTransport = httpTransport;
        this.jsonFactory = jsonFactory;
    }

    public void saveUserCredential(User user, String accessToken, String refreshToken, Long expiresInSeconds, String scope) {
        Optional<UserGoogleCredential> existingOpt = credentialRepository.findByUserId(user.getId());
        UserGoogleCredential credential;

        Instant expiresAt = (expiresInSeconds != null && expiresInSeconds > 0)
                ? Instant.now().plusSeconds(expiresInSeconds)
                : Instant.now().plusSeconds(3600);

        if (existingOpt.isPresent()) {
            credential = existingOpt.get();
            credential.setAccessToken(accessToken);
            if (refreshToken != null && !refreshToken.isBlank()) {
                credential.setRefreshToken(refreshToken);
            }
            credential.setTokenExpiresAt(expiresAt);
            if (scope != null) {
                credential.setScope(scope);
            }
            credential.setUpdatedAt(LocalDateTime.now());
        } else {
            credential = new UserGoogleCredential(user.getId(), accessToken, refreshToken, expiresAt, scope);
        }

        credentialRepository.save(credential);
        user.setDriveConnected(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        logger.info("Successfully saved Google Drive credentials for user ID: {}", user.getId());
    }

    public DriveStatusResponse getStatus(User user) {
        if (!user.isDriveConnected()) {
            return new DriveStatusResponse(false, false, null, null, "Google Drive is not connected.");
        }

        Optional<UserGoogleCredential> credOpt = credentialRepository.findByUserId(user.getId());
        if (credOpt.isEmpty()) {
            user.setDriveConnected(false);
            user.setCampusDocsFolderId(null);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            return new DriveStatusResponse(false, false, null, null, "Google Drive credentials not found. Please connect your Google Drive.");
        }

        String folderId = user.getCampusDocsFolderId();
        if (folderId != null && !folderId.isBlank()) {
            return new DriveStatusResponse(true, true, folderId, FOLDER_NAME, "Google Drive and CampusDocs folder are ready.");
        }

        return new DriveStatusResponse(true, false, null, null, "Google Drive is connected, but CampusDocs folder is not yet initialized.");
    }

    public File ensureDedicatedFolder(User user) {
        // Synchronize on user id intern to prevent duplicate folder creation under concurrent calls
        String lock = ("user-drive-lock-" + user.getId()).intern();
        synchronized (lock) {
            Drive drive = getAuthorizedDriveClient(user);

            // Step 1: Re-check user from DB
            User freshUser = userRepository.findById(user.getId()).orElse(user);
            String existingFolderId = freshUser.getCampusDocsFolderId();

            if (existingFolderId != null && !existingFolderId.isBlank()) {
                try {
                    File folder = drive.files().get(existingFolderId)
                            .setFields("id, name, trashed, mimeType")
                            .execute();

                    if (folder != null && !Boolean.TRUE.equals(folder.getTrashed())
                            && FOLDER_MIME_TYPE.equals(folder.getMimeType())) {
                        logger.info("Reusing existing CampusDocs folder ID: {} for user: {}", existingFolderId, freshUser.getId());
                        return folder;
                    }
                    logger.warn("Previously recorded folder ID {} is trashed or invalid for user: {}. Searching for active folder...",
                            existingFolderId, freshUser.getId());
                } catch (GoogleJsonResponseException e) {
                    if (e.getStatusCode() == 404) {
                        logger.warn("Recorded folder ID {} not found in Google Drive. Searching or creating new...", existingFolderId);
                    } else if (e.getStatusCode() == 401 || e.getStatusCode() == 403) {
                        handleAuthFailure(freshUser, e);
                    } else {
                        logger.error("Error inspecting folder {}: {}", existingFolderId, e.getMessage());
                        throw new DriveException("Google Drive API error: " + e.getDetails().getMessage(), e);
                    }
                } catch (IOException e) {
                    logger.error("IO error validating folder {}: {}", existingFolderId, e.getMessage());
                    throw new DriveException("Communication error with Google Drive API", e);
                }
            }

            // Step 2: Search for an active folder named "CampusDocs" in user's Drive
            try {
                FileList result = drive.files().list()
                        .setQ("mimeType = '" + FOLDER_MIME_TYPE + "' and name = '" + FOLDER_NAME + "' and trashed = false")
                        .setSpaces("drive")
                        .setFields("files(id, name, trashed, mimeType)")
                        .setPageSize(1)
                        .execute();

                if (result.getFiles() != null && !result.getFiles().isEmpty()) {
                    File foundFolder = result.getFiles().get(0);
                    logger.info("Found existing CampusDocs folder in user Drive: {} for user: {}", foundFolder.getId(), freshUser.getId());
                    freshUser.setCampusDocsFolderId(foundFolder.getId());
                    freshUser.setDriveConnected(true);
                    freshUser.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(freshUser);
                    return foundFolder;
                }

                // Step 3: Create dedicated private CampusDocs folder
                logger.info("Creating new CampusDocs folder in user Drive for user: {}", freshUser.getId());
                File folderMetadata = new File();
                folderMetadata.setName(FOLDER_NAME);
                folderMetadata.setMimeType(FOLDER_MIME_TYPE);
                folderMetadata.setDescription("Dedicated CampusDocs folder for academic records and documents.");

                File createdFolder = drive.files().create(folderMetadata)
                        .setFields("id, name")
                        .execute();

                freshUser.setCampusDocsFolderId(createdFolder.getId());
                freshUser.setDriveConnected(true);
                freshUser.setUpdatedAt(LocalDateTime.now());
                userRepository.save(freshUser);
                logger.info("Successfully created CampusDocs folder: {} for user: {}", createdFolder.getId(), freshUser.getId());
                return createdFolder;

            } catch (GoogleJsonResponseException e) {
                if (e.getStatusCode() == 401 || e.getStatusCode() == 403) {
                    handleAuthFailure(freshUser, e);
                }
                logger.error("Google Drive API error during folder retrieval/creation: {}", e.getMessage());
                throw new DriveException("Google Drive API error: " + (e.getDetails() != null ? e.getDetails().getMessage() : e.getMessage()), e);
            } catch (IOException e) {
                logger.error("IO error during folder operation: {}", e.getMessage());
                throw new DriveException("Failed to communicate with Google Drive API", e);
            }
        }
    }

    private Drive getAuthorizedDriveClient(User user) {
        UserGoogleCredential credential = credentialRepository.findByUserId(user.getId())
                .orElseThrow(() -> new DriveException("Google Drive is not connected. Please authorize Google Drive.", true));

        String accessToken = credential.getAccessToken();

        // Refresh token if expired or about to expire
        if (credential.isExpired()) {
            accessToken = refreshAccessToken(user, credential);
        }

        final String finalToken = accessToken;
        HttpRequestInitializer requestInitializer = httpRequest -> {
            httpRequest.getHeaders().setAuthorization("Bearer " + finalToken);
        };

        return new Drive.Builder(httpTransport, jsonFactory, requestInitializer)
                .setApplicationName("CampusDocs")
                .build();
    }

    private String refreshAccessToken(User user, UserGoogleCredential credential) {
        String refreshToken = credential.getRefreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            logger.warn("No refresh token available for user ID: {}. Re-authorization required.", user.getId());
            user.setDriveConnected(false);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            throw new DriveException("Google Drive session has expired. Please re-authorize Google Drive.", true);
        }

        try {
            logger.info("Refreshing expired Google Drive access token for user ID: {}", user.getId());
            TokenResponse tokenResponse = new RefreshTokenRequest(
                    httpTransport,
                    jsonFactory,
                    new GenericUrl("https://oauth2.googleapis.com/token"),
                    refreshToken
            )
            .setClientAuthentication(new ClientParametersAuthentication(clientId, clientSecret))
            .execute();

            String newAccessToken = tokenResponse.getAccessToken();
            Long expiresInSeconds = tokenResponse.getExpiresInSeconds();
            Instant newExpiresAt = (expiresInSeconds != null && expiresInSeconds > 0)
                    ? Instant.now().plusSeconds(expiresInSeconds)
                    : Instant.now().plusSeconds(3600);

            credential.setAccessToken(newAccessToken);
            credential.setTokenExpiresAt(newExpiresAt);
            credential.setUpdatedAt(LocalDateTime.now());
            credentialRepository.save(credential);
            logger.info("Google Drive access token refreshed successfully for user ID: {}", user.getId());
            return newAccessToken;

        } catch (TokenResponseException e) {
            logger.error("Failed to refresh access token for user ID {}: {}", user.getId(), e.getMessage());
            user.setDriveConnected(false);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            throw new DriveException("Google Drive authorization has expired or was revoked. Please reconnect.", true);
        } catch (IOException e) {
            logger.error("Network error while refreshing access token: {}", e.getMessage());
            throw new DriveException("Network error contacting Google OAuth token service.", e);
        }
    }

    public File uploadFile(User user, InputStream inputStream, String fileName, String mimeType, long fileSize) {
        if (!user.isDriveConnected()) {
            throw new DriveException("Google Drive is not connected. Please connect your Google Drive.", true);
        }

        File folder = ensureDedicatedFolder(user);
        String folderId = folder.getId();

        Drive drive = getAuthorizedDriveClient(user);

        try {
            File fileMetadata = new File();
            fileMetadata.setName(fileName);
            fileMetadata.setParents(Collections.singletonList(folderId));

            InputStreamContent mediaContent = new InputStreamContent(mimeType, inputStream);
            mediaContent.setLength(fileSize);

            logger.info("Streaming document '{}' ({} bytes, mime: '{}') to Google Drive folder '{}' for user ID: {}",
                    fileName, fileSize, mimeType, folderId, user.getId());

            File uploadedFile = drive.files().create(fileMetadata, mediaContent)
                    .setFields("id, name, size, mimeType, webViewLink")
                    .execute();

            logger.info("Successfully uploaded file '{}' to Google Drive with ID: {}", fileName, uploadedFile.getId());
            return uploadedFile;

        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 401 || e.getStatusCode() == 403) {
                handleAuthFailure(user, e);
            }
            logger.error("Google Drive API error during file upload: {}", e.getMessage());
            throw new DriveException("Google Drive API upload failed: " + (e.getDetails() != null ? e.getDetails().getMessage() : e.getMessage()), e);
        } catch (IOException e) {
            logger.error("IO error streaming file to Google Drive: {}", e.getMessage());
            throw new DriveException("Communication failure while streaming file to Google Drive.", e);
        }
    }

    public InputStream downloadFile(User user, String driveFileId) {
        if (!user.isDriveConnected()) {
            throw new DriveException("Google Drive is not connected. Please connect Google Drive before accessing documents.", true);
        }
        if (driveFileId == null || driveFileId.isBlank()) {
            throw new IllegalArgumentException("Drive file ID cannot be blank.");
        }

        Drive drive = getAuthorizedDriveClient(user);

        try {
            logger.info("Opening media stream for Google Drive file ID: {} for user: {}", driveFileId, user.getId());
            return drive.files().get(driveFileId).executeMediaAsInputStream();
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 404) {
                logger.warn("File '{}' not found in user Google Drive (status 404).", driveFileId);
                throw new ResourceNotFoundException("The requested document was not found in your Google Drive. It may have been moved or deleted.");
            } else if (e.getStatusCode() == 401 || e.getStatusCode() == 403) {
                handleAuthFailure(user, e);
            }
            logger.error("Google Drive API error downloading file {}: {}", driveFileId, e.getMessage());
            throw new DriveException("Google Drive API error: " + (e.getDetails() != null ? e.getDetails().getMessage() : e.getMessage()), e);
        } catch (IOException e) {
            logger.error("IO error downloading file {} from Google Drive: {}", driveFileId, e.getMessage());
            throw new DriveException("Failed to stream document from Google Drive.", e);
        }
    }

    public void deleteFile(User user, String driveFileId) {
        if (driveFileId == null || driveFileId.isBlank()) {
            return;
        }
        if (!user.isDriveConnected()) {
            throw new DriveException("Google Drive is not connected. Please connect Google Drive before deleting documents.", true);
        }

        try {
            Drive drive = getAuthorizedDriveClient(user);
            logger.info("Deleting file '{}' from Google Drive for user ID: {}", driveFileId, user.getId());
            drive.files().delete(driveFileId).execute();
            logger.info("Successfully deleted file '{}' from Google Drive", driveFileId);
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 404) {
                logger.warn("File '{}' was already missing from Google Drive (404 Not Found). Treating deletion as idempotent success.", driveFileId);
                return;
            } else if (e.getStatusCode() == 401 || e.getStatusCode() == 403) {
                handleAuthFailure(user, e);
            }
            logger.error("Failed to delete file '{}' from Google Drive: {}", driveFileId, e.getMessage());
            throw new DriveException("Failed to delete file from Google Drive: " + (e.getDetails() != null ? e.getDetails().getMessage() : e.getMessage()), e);
        } catch (IOException e) {
            logger.error("IO error deleting file '{}' from Google Drive: {}", driveFileId, e.getMessage());
            throw new DriveException("Communication failure deleting file from Google Drive.", e);
        }
    }

    private void handleAuthFailure(User user, GoogleJsonResponseException e) {
        logger.warn("Authentication failure from Google Drive API for user ID {}: Status code {}", user.getId(), e.getStatusCode());
        user.setDriveConnected(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        throw new DriveException("Google Drive access expired or permission revoked. Please reconnect your account.", true);
    }
}
