package com.muthu.CampusDocus.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);

    private final MongoTemplate mongoTemplate;

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "CampusDocs Backend");
        response.put("timestamp", LocalDateTime.now().toString());

        try {
            Set<String> collections = mongoTemplate.getCollectionNames();
            response.put("status", "UP");
            response.put("database", "CONNECTED");
            response.put("mongoDatabaseName", mongoTemplate.getDb().getName());
            response.put("collectionsFound", collections);
            response.put("message", "MongoDB Atlas connection is active and healthy!");
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logger.error("Health check database failure: ", ex);
            response.put("status", "DEGRADED");
            response.put("database", "DISCONNECTED");
            response.put("error", ex.getMessage());
            response.put("troubleshooting", "Verify MongoDB Atlas Network Access has '0.0.0.0/0' allowed, and verify user credentials in Database Access.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }
}
