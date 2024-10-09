import Image from "next/image";
import React from "react";
import styles from "./Login.module.css";

const Login = () => {
  return (
    <>
      <Image
        className={styles.logo}
        src="/logos/bcp-coupe.png"
        alt=""
        width={491}
        height={900}
      />
      <div className={styles.container}>
        <div className={styles.loginForm}>
          <div className={styles.welcome}>
            Bienvenue
            <Image
              className={styles.welcomeLogo}
              src="/logos/bcp-with-text.png"
              alt=""
              width={228}
              height={40}
            ></Image>
          </div>
          <input placeholder="email" />
          <button>Se connecter</button>
        </div>
      </div>
    </>
  );
};

export default Login;
