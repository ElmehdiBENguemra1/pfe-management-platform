package com.pfe.exception;

public record ErrorResponse(int status, String error, String message) {}
