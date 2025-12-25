import TransactionList from '@/components/TransactionList';

export default function WithdrawalsPage() {
  return (
    <TransactionList 
      type="withdraw" 
      title="ยอดถอนเงิน" 
      subtitle="ดูและกรองรายการถอนเงินทั้งหมด" 
    />
  );
}
