import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client/extension'
import {NextResponse,NextRequest} from 'next/server'
import { v2 as cloudinary } from 'cloudinary';
const prisma = new PrismaClient()

interface CloudinaryResponse {
    public_id: string;
    bytes:number;
    duration?:number;
    [key:string]:any
}    
// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
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
        const title = formData.get('title') as string || null
        const description = formData.get('description') as string || null
        const origionalSize = formData.get('origionalSize') as string || null

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
                {
                    resource_type : "video",
                    folder : "cloudinary-saas-videos",
                    transformation : [
                        {
                            quality : "auto",
                            fetch_format : "mp4"
                        }
                    ]
                },
                (error,result) => {
                    if (error){
                        reject(error)
                    }
                    resolve(result as CloudinaryResponse)
                }
            )
            uploadStream.end(buffer)
        })
        // now use prisma to handle the video stuff 
        const video = await prisma.video.create({
            data : {
                userId,
                title,
                description,
                origionalSize,
                compressedSize : String(result.bytes),
                duration : result.duration || 0,
                videoUrl : result.secure_url,
                videoId : result.public_id
            }
        })
        return NextResponse.json(video)
    } catch (error) {
        console.log("error in uploading video",error)
        return NextResponse.json({
            success : false,
            status : 500,
            error: "Failed to upload image on cloudinary"
        })
    }finally{
        await prisma.$disconnect()
    }
}