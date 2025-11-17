import { useAuth } from "../../../store/Auth";
import { Navigate } from "react-router-dom";

export const ProtectedRoute=({children})=>{

    const {isLoggedIn}= useAuth();

    if(!isLoggedIn){
        return <Navigate to="/" replace />;
    }

    return children;
}