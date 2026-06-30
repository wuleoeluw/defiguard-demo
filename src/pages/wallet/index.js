import React, { useEffect, useState, useRef } from "react";

import "./index.css";

import Header from "../../components/header";
import Footer from "../../components/footer";

function Wallet() {
	return (
		<div>
			<div 
				className="header_section"
			>
				<Header />
			</div>
			<Footer />
		</div>
	);
}


export default Wallet;