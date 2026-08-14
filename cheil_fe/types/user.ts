export type AuthUserAccount = {
  deptCode: string;
  email: string;
  employeeNo: string;
  groupCode: string;
  lastChngDt: string;
  lastChngUser: string;
  loginDt: string;
  loginId: string;
  logoutDt: string;
  picYn: "Y" | "N";
  passwordReset: boolean;
  passwordResetDt: string;
  recentIpAddr: string;
  userPassword: string;
  userName: string;
  useYn: boolean;
  wrongPasswordCount: number;
};
