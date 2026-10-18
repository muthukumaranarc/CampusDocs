package com.muthu.CampusDocus.repository;

import com.muthu.CampusDocus.model.Announcement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends MongoRepository<Announcement, String> {

    List<Announcement> findAllByOrderByPinnedDescCreatedAtDesc();

    List<Announcement> findByCategoryOrderByCreatedAtDesc(String category);

    List<Announcement> findByAuthorIdOrderByCreatedAtDesc(String authorId);
}
