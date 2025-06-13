import { 
    registerUser,
    
} from "../controllers/user.controller.js";




export default async function (fastify, opts) {

    fastify.post("/register", registerUser);


}