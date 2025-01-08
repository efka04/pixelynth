"use client"
import Image from 'next/image'

function ArticleComponent({ post }) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 max-h-[600px] flex flex-col">
            <div className="relative w-full pt-[56.25%] mb-4">
                <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover rounded-lg absolute top-0"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
            <h2 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h2>
            <p className="text-gray-600 line-clamp-3 flex-grow">{post.desc}</p>
            <div className="mt-4 flex items-center gap-2">
                <Image
                    src={post.userImage}
                    alt={post.userName}
                    width={30}
                    height={30}
                    className="rounded-full"
                />
                <span className="text-sm text-gray-500">{post.userName}</span>
            </div>
        </div>
    )
}

export default ArticleComponent