package com.muthu.CampusDocus.exception;

public class DriveException extends RuntimeException {

    private final boolean authorizationRequired;

    public DriveException(String message) {
        super(message);
        this.authorizationRequired = false;
    }

    public DriveException(String message, boolean authorizationRequired) {
        super(message);
        this.authorizationRequired = authorizationRequired;
    }

    public DriveException(String message, Throwable cause) {
        super(message, cause);
        this.authorizationRequired = false;
    }

    public boolean isAuthorizationRequired() {
        return authorizationRequired;
    }
}
