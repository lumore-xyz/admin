"use client";

import Image from "next/image";

const FullLogo = () => {
  return (
    <Image
      src="/lumore-hr.svg"
      alt="Lumore"
      width={170}
      height={44}
      className="rtl:scale-x-[-1] h-auto w-auto max-h-11"
      priority
    />
  );
};

export default FullLogo;
