package com.muthu.CampusDocus.dto;

import java.util.List;

public class FriendsResponse {
    private MentorResponse myMentor;
    private List<UserProfileResponse> sameMentorFriends;
    private List<UserProfileResponse> otherMentorStudents;

    public FriendsResponse() {
    }

    public FriendsResponse(MentorResponse myMentor, List<UserProfileResponse> sameMentorFriends, List<UserProfileResponse> otherMentorStudents) {
        this.myMentor = myMentor;
        this.sameMentorFriends = sameMentorFriends;
        this.otherMentorStudents = otherMentorStudents;
    }

    public MentorResponse getMyMentor() {
        return myMentor;
    }

    public void setMyMentor(MentorResponse myMentor) {
        this.myMentor = myMentor;
    }

    public List<UserProfileResponse> getSameMentorFriends() {
        return sameMentorFriends;
    }

    public void setSameMentorFriends(List<UserProfileResponse> sameMentorFriends) {
        this.sameMentorFriends = sameMentorFriends;
    }

    public List<UserProfileResponse> getOtherMentorStudents() {
        return otherMentorStudents;
    }

    public void setOtherMentorStudents(List<UserProfileResponse> otherMentorStudents) {
        this.otherMentorStudents = otherMentorStudents;
    }
}
