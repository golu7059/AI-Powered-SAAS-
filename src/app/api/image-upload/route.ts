import { NextRequest,NextResponse } from 'next/server'

import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

import { PrismaClient } from '@prisma/client/extension';


const prisma  = PrismaClient()

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    interface CloudinaryResponse {
        public_id: string;
        [key:string]:any
    }    
  
export async function POST(request:NextRequest){
    const {userId}:any = auth()

    if (!userId){
        return NextResponse.json({
            success : false,
            status : 401,
            error: "Unauthorized"
        })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File || null

        if (!file){
            return NextResponse.json({
                success : false,
                status : 400,
                error: "No file found"
            })
        }
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const result = await new Promise<CloudinaryResponse>((resolve,reject) =>{
            const uploadStream = cloudinary.uploader.upload_stream(
                {folder : "cloudinary-saas"},
                (error,result) => {
                    if (error){
                        reject(error)
                    }
                    resolve(result as CloudinaryResponse)
                }
            )
            uploadStream.end(buffer)
        })
        return NextResponse.json({
            success:true,
            status:200,
            publicId : result.public_id
        })
    } catch (error) {
        console.log("error in uploading image",error)
        return NextResponse.json({
            success : false,
            status : 500,
            error: "Failed to upload image on cloudinary"
        })
    }
}