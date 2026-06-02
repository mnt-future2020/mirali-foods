export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#007D71]/20 border-t-[#007D71] rounded-full animate-spin" />
        <p className="text-[10px] font-sans font-black text-[#007D71] uppercase tracking-widest">
          Loading...
        </p>
      </div>
    </div>
  );
}
