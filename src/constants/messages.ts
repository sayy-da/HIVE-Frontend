export const AuthMessage = {
  EmailRequired: "Please enter your email",
  EmailPasswordRequired: "Please enter email and password",
  EmailPasswordRequiredLogin: "Please enter your email and password",
  LoginSuccessful: "Login successful",
  LoggedOutSuccessfully: "Logged out successfully",
  OTPVerified: "OTP verified",
  OTPSent: "OTP sent",
  UserRegistered: "User registered",
  OTPResent: "OTP Sent",
} as const;

export const ValidationMessage = {
  AllFieldsRequired: "Please fill in all fields",
  AllRequiredFieldsRequired: "Please fill in all required fields",
  PasswordRequired: "Password is required",
  PasswordsDoNotMatch: "Passwords do not match",
  PasswordMinLength8: "Password must be at least 8 characters",
  PasswordMinLength6: "Password must be at least 6 characters long",
  OTPCodeRequired: "Please enter the OTP code",
  EmailNotFound: "Email not found. Please start registration again.",
  CompanyIdNotFound: "Company ID not found",
  CompanyIdMissing: "Company ID is missing. Please use the correct link.",
  CompanyIdMissingRegistration: "Company ID is missing. Please start registration again.",
  InvalidInviteLink: "Invalid invite link. Please contact your administrator.",
  BothPasswordFieldsRequired: "Please enter both password fields",
} as const;

export const SuccessMessage = {
  EmployeeApproved: "Employee approved successfully!",
  EmployeeActivated: "Employee activated successfully!",
  EmployeeDeactivated: "Employee deactivated successfully!",
  LoggedOutSuccessfully: "Logged out successfully",
  EmployeeProfileCreated: "Employee profile created and invite sent successfully!",
  ProfileCompleted: "Profile completed successfully!",
  RegistrationCompleted: "Registration completed successfully! You can now login.",
  PasswordSetSuccessfully: "Password set successfully! You can now login.",
  CompanyStatusUpdated: "Company status updated successfully",
  CompanyUpdatedSuccessfully: "Company details updated successfully!",
  LoginSuccessful: "Login successful",
  OTPSent: "OTP sent successfully!",
  OTPVerified: "OTP verified successfully!",
  OTPResent: "OTP resent successfully!",
  RegistrationCompletedSuccess: "Registration completed successfully!",
} as const;

export const ErrorMessage = {
  FailedToFetchRequestedEmployees: "Failed to fetch requested employees",
  FailedToFetchEmployees: "Failed to fetch employees",
  FailedToApproveEmployee: "Failed to approve employee",
  FailedToUpdateEmployeeStatus: "Failed to update employee status",
  FailedToUpdateCompany: "Failed to update company details",
  SomeErrorOccurred: "Some error occurred",
  YouAreBlocked: "You are blocked by admin",
} as const;

