import LoginForm from '@/components/forms/LoginForm';

 function LoginPage() {
    return (
        <div className='login-page'>
            <h1>Login</h1>
            <div>
                <LoginForm/>
            </div>
        </div>
    );
}

export default LoginPage;