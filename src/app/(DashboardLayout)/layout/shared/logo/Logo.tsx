"use client";

import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href={"/"}>
      <Image
        src={"/lumore-hr.svg"}
        alt="Lumore"
        width={42}
        height={42}
        className="h-10 w-10 object-contain"
      />
    </Link>
  );
};

export default Logo;
