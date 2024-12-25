 import {Response,Request,NextFunction} from 'express';
import jwt,{JwtPayload} from 'jsonwebtoken'
import { JWT_SECRET } from "./config";

export  const userMiddleware = (req:Request,res:Response,next:NextFunction)=>{
    const header=req.headers['authorization'];
    const  decoded = jwt.verify(header as string,JWT_SECRET)
    if(decoded){
        if(typeof decoded === 'string'){
            res.status(403).json({message:"you are not loged in"})
        }
        //@ts-ignore
        req.userId = (decoded as JwtPayload).id;
        next()
       
    }else{
        res.status(403).json({message:"your not loged in"})
    }
  
}