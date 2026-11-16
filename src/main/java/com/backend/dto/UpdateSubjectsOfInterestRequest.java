package com.backend.dto;

import java.util.List;

public class UpdateSubjectsOfInterestRequest {

    private List<Long> subjectIds;

    public List<Long> getSubjectIds() { return subjectIds; }
    public void setSubjectIds(List<Long> subjectIds) { this.subjectIds = subjectIds; }
}
