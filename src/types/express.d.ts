

declare global{
    namespace Express{
        interface Request{
            user?:{
                userId: string,
                username: string,
                role: 'normalUser' | 'admin'
            }
        }
    }
}

export {}