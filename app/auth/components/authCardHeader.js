export default function AuthCardHeader({ type }) {
  const isLogin = type === 'login';
  
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-[#111111] mb-1">
        {isLogin ? 'Staff Login' : 'Create Account'}
      </h2>
      <p className="text-xs text-[#8C8C8C]">
        {isLogin ? 'Sign in to your account to continue' : 'Register your restaurant system workspace'}
      </p>
    </div>
  );
}