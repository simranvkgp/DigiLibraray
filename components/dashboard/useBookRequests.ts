"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookSuggestionSchema, type BookSuggestionInput } from "@/lib/validations";
import type { BookSuggestionStatus } from "@/types";

export interface SuggestionRow {
  id: string;
  title: string;
  status: BookSuggestionStatus;
  createdAt: string;
}

export interface AccessRequestRow {
  id: string;
  status: "PENDING" | "APPROVED";
  createdAt: string;
  book: { id: string; title: string };
}

export interface BookNameOption {
  id: string;
  name: string;
  className: string | null;
  author: string | null;
}

export const statusVariant: Record<BookSuggestionStatus, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  ADDED: "success",
  REJECTED: "destructive",
};

export const accessRequestStatusVariant: Record<AccessRequestRow["status"], "warning" | "success"> = {
  PENDING: "warning",
  APPROVED: "success",
};

export function useBookRequests() {
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestRow[]>([]);
  const [bookNames, setBookNames] = useState<BookNameOption[]>([]);
  const [error, setError] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<BookSuggestionInput>({ resolver: zodResolver(bookSuggestionSchema) });

  const loadSuggestions = useCallback(() => {
    fetch("/api/book-suggestions")
      .then((r) => r.json())
      .then((data) => setSuggestions(data.suggestions ?? []));
  }, []);

  useEffect(() => {
    loadSuggestions();
    fetch("/api/book-names")
      .then((r) => r.json())
      .then((data) => setBookNames(data.bookNames ?? []));
    fetch("/api/book-requests")
      .then((r) => r.json())
      .then((data) => setAccessRequests(data.requests ?? []));
  }, [loadSuggestions]);

  async function onSubmit(data: BookSuggestionInput, onSuccess?: () => void) {
    setError(false);
    const res = await fetch("/api/book-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setError(true);
      return;
    }
    reset();
    loadSuggestions();
    onSuccess?.();
  }

  const hasPendingSuggestion = suggestions.some((s) => s.status === "PENDING");

  return {
    suggestions,
    accessRequests,
    bookNames,
    error,
    register,
    setValue,
    handleSubmit,
    isSubmitting,
    onSubmit,
    hasPendingSuggestion,
  };
}
