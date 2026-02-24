import Link from "next/link";
import Image from "next/image";

const FullLogo = () => {
  return (
    <Link href="/">
      <Image
        src="/images/logo/logo.png"
        alt="BAFA Logo"
        width={80}
        height={80}
        className="dark:hidden"
      />
      <Image
        src="/images/logo/logo.png"
        alt="BAFA Logo"
        width={80}
        height={80}
        className="hidden dark:block"
      />
    </Link>
  );
};

export default FullLogo;
