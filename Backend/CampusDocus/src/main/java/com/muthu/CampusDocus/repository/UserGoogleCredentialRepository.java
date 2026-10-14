package com.muthu.CampusDocus.repository;

import com.muthu.CampusDocus.model.UserGoogleCredential;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserGoogleCredentialRepository extends MongoRepository<UserGoogleCredential, String> {

    Optional<UserGoogleCredential> findByUserId(String userId);

    void deleteByUserId(String userId);
}
