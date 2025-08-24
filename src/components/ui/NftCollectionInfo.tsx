import { CheckCircleIcon } from "lucide-react";
import Image from "next/image";

interface NftInfoItem {
  label: string;
  value: string;
}

interface NftCollectionInfoProps {
  name: string;
  infoItems: NftInfoItem[];
  primaryImageSrc: string;
  secondaryImageSrc?: string;
  className?: string;
}

export function NftCollectionInfo({
  name,
  infoItems,
  primaryImageSrc,
  secondaryImageSrc,
  className = "",
}: NftCollectionInfoProps): JSX.Element {
  return (
    <div className={`w-full bg-white border border-[#f0f0f0] p-4 rounded-md ${className}`}>
      <div className="flex items-center justify-center gap-2 px-3 mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
            <Image
              className="object-cover"
              width={32}
              height={32}
              alt="NFT collection"
              src={primaryImageSrc}
            />
          </div>
          {secondaryImageSrc && (
            <div className="w-8 h-8 rounded-full overflow-hidden -ml-2 bg-gray-100">
              <Image
                className="object-cover"
                width={32}
                height={32}
                alt="NFT collection"
                src={secondaryImageSrc}
              />
            </div>
          )}
        </div>
        <div className="font-medium text-sm text-gray-900">
          {name}
        </div>
        <CheckCircleIcon className="w-4 h-4 text-[#FF2E00]" />
      </div>

      <div className="grid grid-cols-3 gap-1 text-center">
        {infoItems.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1"
          >
            <div className="text-sm text-gray-500">
              {item.label}
            </div>
            <div className="font-semibold text-gray-900">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
