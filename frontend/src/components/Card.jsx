import './Card.css'

function Card({ card }) {
  if (card.hidden) {
    return (
      <div className="card face-down">
        <div className="card-back">
          <div className="center-icon">♠</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${card.is_red ? 'red' : ''}`}>
      <span className="corner top">
        {card.rank}{card.symbol}
      </span>
      <span className="suit">{card.symbol}</span>
      <span className="corner bottom">
        {card.symbol}{card.rank}
      </span>
    </div>
  )
}

export default Card
