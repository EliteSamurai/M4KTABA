import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { readClient } from '@/studio-m4ktaba/client';
import { getServerSession } from 'next-auth';
import ProfileForm from '@/components/ProfileForm';

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <div>Please log in to view your profile.</div>;
  }

  const email = session.user.email;
  const query = `*[_type == "user" && email == $email][0]`;

  if (!readClient) {
    return <div>Database connection not available.</div>;
  }

  const user = await (readClient as any).fetch(query, { email });

  if (!user) {
    return (
      <main className='flex-1 py-6'>
        <div className='container mx-auto px-4'>
          <div className='rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive'>
            <p>User profile not found. Please contact support.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 py-6'>
      <ProfileForm session={session} user={user} />
    </main>
  );
}
