export default function Loading() {
  return (
    <div className='w-full max-w-md mx-auto p-6'>
      <div className='space-y-8'>
        <div className='space-y-4'>
          <div className='flex items-center justify-center'>
            <div className='relative'>
              <span className='text-2xl font-bold'>gif</span>
              <div className='absolute -bottom-1 right-0 w-6 h-6 bg-yellow-300 rounded-full -z-10' />
            </div>
          </div>
          <div className='relative h-2 bg-gray-100 rounded-full overflow-hidden'>
            <div className='absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300' />
          </div>
          <p className='text-center text-sm text-gray-500'>Uploading...</p>
        </div>
      </div>
    </div>
  );
}
