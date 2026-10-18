package com.muthu.CampusDocus;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Set;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Disabled("Manual utility test only - do not run in normal test suite")
class ResetDatabaseTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void resetAllCollections() {
        Set<String> collections = mongoTemplate.getCollectionNames();
        System.out.println("Found collections: " + collections);
        for (String col : collections) {
            if (!col.startsWith("system.")) {
                mongoTemplate.dropCollection(col);
                System.out.println("Dropped collection: " + col);
            }
        }
        System.out.println("Database reset complete. All collections cleared.");
    }
}
