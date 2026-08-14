"use client";

import { useMutation } from "@tanstack/react-query";

import { login, signup, type LoginRequest, type LoginResponse, type SignupRequest, type SignupResponse } from "@/modules/auth/authApi";

export function useLoginMutation() {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: login,
  });
}

export function useSignupMutation() {
  return useMutation<SignupResponse, Error, SignupRequest>({
    mutationFn: signup,
  });
}
