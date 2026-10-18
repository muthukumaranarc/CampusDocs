package com.muthu.CampusDocus.config;

import com.muthu.CampusDocus.model.Document;
import com.muthu.CampusDocus.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

@Component
public class MongoIndexConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoIndexConfig.class);

    private final MongoTemplate mongoTemplate;

    public MongoIndexConfig(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureIndexes() {
        try {
            log.info("Verifying MongoDB indexes...");

            // Resolve any conflicting index on 'users' collection
            for (org.bson.Document idx : mongoTemplate.getCollection("users").listIndexes()) {
                String name = idx.getString("name");
                boolean isSparse = Boolean.TRUE.equals(idx.getBoolean("sparse"));
                if ("googleSubject".equals(name) && !isSparse) {
                    log.warn("Detected conflicting non-sparse index 'googleSubject'. Dropping it to align with User model...");
                    mongoTemplate.getCollection("users").dropIndex("googleSubject");
                    log.info("Successfully dropped legacy 'googleSubject' index.");
                }
            }

            IndexOperations userIndexOps = mongoTemplate.indexOps(User.class);
            safeEnsureIndex(userIndexOps, new Index().on("googleSubject", Sort.Direction.ASC).unique().sparse());
            safeEnsureIndex(userIndexOps, new Index().on("email", Sort.Direction.ASC).unique());
            safeEnsureIndex(userIndexOps, new Index().on("mentorId", Sort.Direction.ASC));

            IndexOperations docIndexOps = mongoTemplate.indexOps(Document.class);
            safeEnsureIndex(docIndexOps, new Index().on("userId", Sort.Direction.ASC));
            safeEnsureIndex(docIndexOps, new Index().on("driveFileId", Sort.Direction.ASC));

            log.info("MongoDB indexes verified and ensured successfully.");
        } catch (Exception e) {
            log.warn("Notice while verifying MongoDB indexes: {}", e.getMessage());
        }
    }

    private void safeEnsureIndex(IndexOperations ops, Index index) {
        try {
            ops.ensureIndex(index);
        } catch (Exception e) {
            log.debug("Index already present or compatible: {}", e.getMessage());
        }
    }
}
