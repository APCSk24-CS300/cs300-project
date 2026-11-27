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

            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={() => {router.push(`/${role}/dashboard`)}}>
                Click Me
            </button>

        </div>
    );
}

export default TestPage;