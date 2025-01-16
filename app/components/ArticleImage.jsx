import Image from 'next/image'
import React, { useState } from 'react'

function ArticleImage({ articleDetails }) {
  
  // Define getJpgUrl before using it in useState
  const getJpgUrl = (pngUrl, appendJpg) => {
    if (!pngUrl) return '';
    
    // Extraire le nom du fichier de l'URL PNG
    const filename = pngUrl
      .split('/o/')[1]  // Prendre la partie après /o/
      .split('?')[0]    // Enlever les paramètres
      .split('%2F')[1]  // Prendre le nom après images%2F
      .replace('.png', '');  // Enlever l'extension
    
    // Construire l'URL JPG avec the option to append .jpg
    if (appendJpg) {
      return `https://firebasestorage.googleapis.com/v0/b/pixelynth-c41ea.firebasestorage.app/o/jpg%2F${filename}.jpg?alt=media`;
    } else {
      return `https://firebasestorage.googleapis.com/v0/b/pixelynth-c41ea.firebasestorage.app/o/jpg%2F${filename}?alt=media`;
    }
  }

  const [srcUrl, setSrcUrl] = useState(getJpgUrl(articleDetails?.image, true));

  const handleError = () => {
    const fallbackUrl = getJpgUrl(articleDetails?.image, false);
    if (fallbackUrl !== srcUrl) {
      setSrcUrl(fallbackUrl);
    }
  }

  return (
    <div>
      {articleDetails && 
        <Image 
          src={srcUrl}
          alt={articleDetails?.title || 'Article image'}
          width={1000}
          height={1000}
          onClick={articleDetails?.link ? () => window.open(articleDetails.link) : undefined}
          onError={handleError} // Add onError handler
          className={`rounded-3xl ${articleDetails?.link ? 'cursor-pointer' : 'cursor-default'}`}
          priority={true}
        />
      }
    </div>
  )
}

export default ArticleImage;

<button 
onClick={() => router.push('/license')} 
className='bg-white border border-gray-300 hover:bg-gray-50 px-3 py-2 text-sm text-gray-600 rounded-lg'
>
View License
</button>
