export const config = {
  API: {
    REFERRAL: {
      USERS: (code: string) => `/api/referred-users/${code}/`,
      WALLET: "/api/wallet/referral-wallet/",
    },
    BLOG: {
      BLOGS: "/administration/blogs/blog/",
      NEWS: "/administration/blogs/news/",
    },

  },
};
