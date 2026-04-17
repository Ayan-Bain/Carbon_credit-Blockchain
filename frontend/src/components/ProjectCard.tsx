'use client';

interface ProjectCardProps {
  image: string;
  title: string;
  subtitle: string;
  category: string;
  price: string;
  description: string;
  available: string;
  onBuy: () => void;
}

export default function ProjectCard({
  image,
  title,
  subtitle,
  category,
  price,
  description,
  available,
  onBuy,
}: ProjectCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all">
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-[#1b4332] to-[#012d1d] flex items-center justify-center text-white text-3xl">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="absolute text-5xl">🌲</span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[#012d1d]">{title}</h3>
          <span className="text-xs font-bold bg-[#e3f2fd] text-[#1565c0] px-2 py-1 rounded">
            {category}
          </span>
        </div>

        <p className="text-sm text-[#717973] mb-3">{subtitle}</p>
        <p className="text-xs text-[#717973] line-clamp-2 mb-3">{description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-[#717973] font-bold uppercase">Price</p>
            <p className="font-bold text-[#012d1d]">{price}</p>
          </div>
          <div>
            <p className="text-xs text-[#717973] font-bold uppercase">Available</p>
            <p className="font-bold text-[#012d1d]">{available}</p>
          </div>
        </div>

        <button
          onClick={onBuy}
          className="w-full bg-gradient-to-r from-[#012d1d] to-[#1b4332] text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
        >
          Buy Credits
        </button>
      </div>
    </div>
  );
}
