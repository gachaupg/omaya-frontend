declare module 'reactjs-social-login' {
  export const LoginSocialFacebook: React.ComponentType<{
    appId: string;
    onResolve: (response: any) => void;
    onReject: (error: any) => void;
    children: React.ReactNode;
    className?: string;
  }>;
}

declare module 'react-social-login-buttons' {
  export const FacebookLoginButton: React.ComponentType<{
    className?: string;
    children?: React.ReactNode;
  }>;
}
