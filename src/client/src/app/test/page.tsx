'use client';

import LoginForm from '@/features/auth/components/LoginForm';
import { useRouter } from 'next/navigation';

 function TestPage() {
    const router = useRouter();
    const role = 'admin'; // URL segment, not a role code
    return (
        <div className='login-page'>
            <h1>Login</h1>
            <div>
                <LoginForm/>
            </div>

            <button className="bg-primary text-on-primary px-4 py-2 rounded hover:bg-primary-dark" onClick={() => {router.push(`/${role}/dashboard`)}}>
                Click Me
            </button>

        </div>
    );
}

export default TestPage;