package com.muthu.CampusDocus.repository;

import com.muthu.CampusDocus.model.Document;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends MongoRepository<Document, String> {

    List<Document> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<Document> findByIdAndUserId(String id, String userId);

    Optional<Document> findFirstByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserId(String userId);

    List<Document> findTop5ByUserIdOrderByCreatedAtDesc(String userId);
}
