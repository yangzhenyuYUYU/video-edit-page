import http from "@/utils/http";

// 提现记录状态枚举
export enum WithdrawalStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

// 佣金信息接口类型
export interface CommissionInfo {
  total_commission: number;      // 总佣金金额
  available_amount: number;      // 可提现金额
  withdrawn_amount: number;      // 已提现金额
  pending_withdrawal: number;    // 待审核提现金额
  recent_withdrawals: {
    id: string;
    amount: number;
    status: WithdrawalStatus;
    created_at: string;
    remark: string;
  }[];
}

export const getUserInfo = () => {
  return http.get("/user/profile");
};

// 获取用户佣金信息
export const getCommissionInfo = () => {
  return http.get<{
    code: number;
    msg: string;
    data: CommissionInfo;
  }>("/user/commission_info");
};

// 提现申请
export const applyWithdrawal = (amount: number) => {
  return http.post<{
    code: number;
    msg: string;
    data: {
      id: string;
      amount: number;
      status: WithdrawalStatus;
      created_at: string;
    };
  }>("/withdrawal/apply", { amount });
};

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/user/upload_avatar', formData, {
      headers: {
          'Content-Type': 'multipart/form-data'
      }
  });
};

export async function updateNickname(data: {
  nickname?: string;
}) {
  return http.post<{
    code: number;
    msg: string;
  }>('/user/update_nickname', data);
}

export default {
  getUserInfo,
  getCommissionInfo,
  applyWithdrawal,
  uploadAvatar,
  updateNickname
};
