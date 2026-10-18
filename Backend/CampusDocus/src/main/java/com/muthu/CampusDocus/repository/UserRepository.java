package com.muthu.CampusDocus.repository;

import com.muthu.CampusDocus.model.User;
import com.muthu.CampusDocus.model.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByGoogleSubject(String googleSubject);

    Optional<User> findByEmail(String email);

    Optional<User> findFirstByRole(UserRole role);

    List<User> findByRole(UserRole role);

    List<User> findByRoleOrderByDisplayNameAsc(UserRole role);

    List<User> findByMentorId(String mentorId);

    long countByRole(UserRole role);

    long countByMentorId(String mentorId);

    List<User> findByRoleAndMentorIdIsNull(UserRole role);
}
