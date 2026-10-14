package com.muthu.CampusDocus.dto;

import com.muthu.CampusDocus.model.Document;

import java.io.InputStream;

public class DocumentFileStream {

    private final Document document;
    private final InputStream inputStream;

    public DocumentFileStream(Document document, InputStream inputStream) {
        this.document = document;
        this.inputStream = inputStream;
    }

    public Document getDocument() {
        return document;
    }

    public InputStream getInputStream() {
        return inputStream;
    }
}
