import TransactionList from '@/components/TransactionList';

export default function DepositsPage() {
  return (
    <TransactionList 
      type="deposit" 
      title="ยอดฝากเงิน" 
      subtitle="ดูและกรองรายการฝากเงินทั้งหมด" 
    />
  );
}
