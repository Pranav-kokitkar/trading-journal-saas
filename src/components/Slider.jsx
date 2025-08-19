import styles from "../styles/slider.module.css"

export const Slider=()=>{
    return(
        <section className={styles.slider}>
            <div className={styles.sliderName}>Trading Journal</div>
            <div  className={styles.sliderLinks}>
                <ul>
                    <li>Dashboard</li>
                    <li>Add Trade</li>
                    <li>Trade History</li>
                </ul>
            </div>
        </section>
    )
}