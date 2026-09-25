export type AttendanceType = "IN" | "OUT";

export type AttendanceRecord = {
  id: string;
  type: AttendanceType;
  created_at: string;
  workplace_name: string | null;
};

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  employee_number: string | null;
  role: string;
  active: boolean;
  workplace_name: string | null;
};

export type ScanErrorCode =
  | "INVALID_QR"
  | "WORKPLACE_INACTIVE"
  | "ALREADY_CHECKED_IN"
  | "ALREADY_CHECKED_OUT"
  | "WRONG_WORKPLACE"
  | "NO_WORKPLACE"
  | "ACCOUNT_INACTIVE"
  | "PROFILE_NOT_FOUND"
  | "UNAUTHORIZED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR";

export type CameraErrorCode = "CAMERA_DENIED" | "CAMERA_NOT_FOUND" | "CAMERA_IN_USE" | "CAMERA_INSECURE" | "CAMERA_UNSUPPORTED";

export type ScanResponse = { ok: true; record: AttendanceRecord } | { ok: false; code: ScanErrorCode };
