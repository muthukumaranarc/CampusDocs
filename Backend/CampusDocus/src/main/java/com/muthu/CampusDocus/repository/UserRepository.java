package com.muthu.CampusDocus.repository;

import com.muthu.CampusDocus.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByGoogleSubject(String googleSubject);

    Optional<User> findByEmail(String email);
}
