const ROUTES = [
    {
        url: '/api/user/*',
        auth: false,
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100
        },
        proxy: {
            target: `http://${process.env.USER_DOMAIN}:8080`,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/user`]: '',
            },
        }
    },
    {
        url: '/api/movie/*',
        auth: true,
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100
        },
        proxy: {
            target: `http://${process.env.MOVIE_RECOMMENDER_DOMAIN}:8081`,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/movie`]: '/',
            },
        }
    }
]

exports.ROUTES = ROUTES;