import { useState } from "react";
import {
  VerificationResult,
  verifyFace as verifyFaceApi,
} from "@/shared/lib/api-client/face-verification";

export function useFaceVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyFace = async (selfieBase64: string) => {
    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const result = await verifyFaceApi({
        selfieBase64,
      });
      setVerificationResult(result);
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Face verification failed";
      setError(msg);
      return null;
    } finally {
      setIsVerifying(false);
    }
  };

  const reset = () => {
    setVerificationResult(null);
    setError(null);
  };

  const verificationPassed =
    verificationResult !== null &&
    verificationResult.faceDetected &&
    (verificationResult.match || verificationResult.confidence >= 70);

  return {
    isVerifying,
    verificationResult,
    verificationPassed,
    error,
    verifyFace,
    reset,
  };
}
