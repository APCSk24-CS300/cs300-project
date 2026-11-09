import { useRouter } from "next/navigation";

export function useCommonRouter() {
    const router = useRouter();
    if (!router){
        console.error("Router is not available. Make sure to use this hook within a Next.js component.");
    }
    return router;
}   