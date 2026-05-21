import { toast } from 'sonner';

const notify = {
  success: (msg: string) => toast.success(msg, { duration: 4000 }),
  error: (msg: string) => toast.error(msg, { duration: 0 }),
  info: (msg: string) => toast(msg, { duration: 4000 }),
};

export const { success, error, info } = notify;
export default notify;
