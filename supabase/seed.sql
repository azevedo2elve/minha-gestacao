-- Seed data for gestational_weeks_metadata (Weeks 1 to 42)
-- Brazilian Portuguese perinatal terminology & warm doula tips

INSERT INTO gestational_weeks_metadata (
  week_number, trimester, baby_size_comparison, illustration_key, avg_length_cm, avg_weight_g, baby_development_summary, mother_body_changes, doula_tip_of_week
) VALUES
(
  1, 1, 'Início do Ciclo', 'cycle_start', 0.1, 0,
  'Seu ciclo menstrual está começando. O endométrio se renova e os folículos começam a maturar nos ovários.',
  'Menstruação e alterações hormonais típicas. O corpo se prepara para uma potencial concepção.',
  'Descanse bastante, beba água e inicie o uso de ácido fólico se já estiver planejando.'
),
(
  2, 1, 'Ovulação', 'ovulation', 0.1, 0,
  'A ovulação ocorre por volta deste período. O óvulo maduro é liberado na tuba uterina aguardando a fertilização.',
  'Aumento da libido e presença de muco cervical fértil (aspecto de clara de ovo).',
  'Conecte-se com seu corpo e observe os sinais de fertilidade com serenidade e carinho.'
),
(
  3, 1, 'Blastocisto', 'blastocyst', 0.2, 0,
  'Fecundação! O óvulo fertilizado viaja para o útero, dividindo-se rapidamente em centenas de células especializadas.',
  'O corpo começa a produzir o hormônio hCG. Algumas mulheres sentem leve pontada ou cólica de implantação.',
  'Respire fundo e mantenha hábitos tranquilos. Pequenos sangramentos de nidação podem ocorrer e são naturais.'
),
(
  4, 1, 'Semente de Papoula', 'poppy_seed', 0.4, 1,
  'O blastocisto se fixa no endométrio (nidação). O saco gestacional e a placenta primitiva começam a se formar.',
  'Atraso menstrual perceptível. Os seios podem ficar mais sensíveis e o olfato mais aguçado.',
  'Parabéns pela descoberta! Agende seu primeiro acolhimento e evite esforços excessivos.'
),
(
  5, 1, 'Semente de Maçã', 'apple_seed', 0.5, 1,
  'O tubo neural está se fechando. O coração primitivo começa a bater de forma ritmada.',
  'Sensação de cansaço extremo e sonolência repentina. Possível início de leves náuseas matinais.',
  'Respeite a necessidade de sono do seu corpo. Ele está gastando muita energia para construir novos órgãos.'
),
(
  6, 1, 'Grão de Ervilha', 'pea', 0.8, 2,
  'Brotos dos membros inferiores e superiores aparecem. Formam-se os olhos, orelhas e a mandíbula primária.',
  'Aumento da frequência urinária à medida que o útero cresce e comprime a bexiga.',
  'Tenha sempre um lanche leve ao lado da cama (como bolacha de água e sal) para amenizar enjoos ao acordar.'
),
(
  7, 1, 'Mirtilo', 'blueberry', 1.3, 3,
  'O cérebro divide-se em três partes principais e gera cerca de 100 novas células nervosas por minuto.',
  'As aversões e desejos alimentares podem se intensificar. O volume de sangue começa a expandir.',
  'Chá de gengibre fresco e água com gotas de limão são aliados gentis e naturais contra as náuseas.'
),
(
  8, 1, 'Framboesa', 'raspberry', 1.6, 4,
  'Dedinhos das mãos e pés começam a se separar. O bebê já se move suavemente no líquido amniótico.',
  'Flutuações de humor causadas pela progesterona e estrogênio em alta.',
  'Compartilhe seus sentimentos com sua doula e sua rede de apoio. Nenhuma emoção precisa ser enfrentada sozinha.'
),
(
  9, 1, 'Azeitona Verde', 'green_olive', 2.3, 6,
  'O coração está totalmente dividido em quatro câmaras. Os músculos começam a responder a reflexos.',
  'A cintura começa a mudar suavemente. A sensação de inchaço abdominal é comum.',
  'Use roupas confortáveis que não apertem o ventre. Um banho morno relaxante ajuda a aliviar tensões.'
),
(
  10, 1, 'Ameixa Pequena', 'small_plum', 3.1, 10,
  'Fim da fase embrionária e início da fase fetal. Todos os órgãos vitais já estão formados e em maturação.',
  'As náuseas costumam atingir seu pico nesta fase para depois começarem a regredir.',
  'Coma em pequenas porções várias vezes ao dia e hidrate-se com goles pequenos e frequentes de água de coco.'
),
(
  11, 1, 'Limão Siciliano Pequeno', 'lime', 4.1, 15,
  'O bebê consegue abrir e fechar as mãozinhas e começar a praticar movimentos de sucção e deglutição.',
  'A pele e os cabelos podem ficar mais radiantes pelo aumento da circulação sanguínea.',
  'Momento ideal para realizar a ultrassonografia com translucência nucal e conversar com seu médico.'
),
(
  12, 1, 'Maracujá Doce', 'passion_fruit', 5.4, 25,
  'As unhas começam a brotar e as cordas vocais já estão se estruturando. O esqueleto começa a ossificar.',
  'O útero sobe acima da sínfise púbica, diminuindo um pouco a pressão direta sobre a bexiga.',
  'Celebre o encerramento do primeiro trimestre. A vitalidade e a energia costumam voltar nos próximos dias.'
),
(
  13, 1, 'Pêssego', 'peach', 7.4, 40,
  'O bebê já tem impressões digitais exclusivas e seus intestinos migram da cavidade umbilical para o abdômen.',
  'O segundo trimestre se aproxima trazendo alívio dos enjoos e mais disposição física.',
  'Comece a fazer caminhadas leves e exercícios de respiração e mobilidade pélvica orientados.'
),
(
  14, 1, 'Limão Taiti', 'lemon', 8.7, 65,
  'O bebê começa a fazer expressões faciais: franze a testa, faz caretas e pode até chupar o dedinho.',
  'A barriguinha pode começar a aparecer sutilmente. Aumento do apetite.',
  'Nutra-se com alimentos coloridos e ricos em ferro, cálcio e ômega-3. Escute os sinais de fome do seu corpo.'
),
(
  15, 1, 'Maçã', 'apple', 10.1, 95,
  'A pele do bebê é muito fina e transparente, coberta por uma penugem macia chamada lanugem.',
  'Pode surgir leve congestão nasal ou sangramento gengival devido ao aumento do volume sanguíneo.',
  'Use escova de dentes com cerdas ultra macias e lave as narinas com soro fisiológico diariamente.'
),
(
  16, 1, 'Abacate', 'avocado', 11.6, 130,
  'O bebê já consegue ouvir sons do corpo da mãe, como os batimentos cardíacos, voz e sons digestivos.',
  'Você pode sentir pequenas cócegas ou "bolhas de ar" se movendo no baixo ventre.',
  'Converse e cante para o seu bebê. Ele já reconhece o som acolhedor da sua voz.'
),
(
  17, 1, 'Nabo', 'turnip', 13.0, 175,
  'O tecido adiposo (gordura marrom) começa a ser depositado para manter a temperatura do bebê após o nascimento.',
  'O centro de gravidade do corpo começa a mudar; observe sua postura ao caminhar e sentar.',
  'Evite calçados que desestabilizem a pisada e lembre-se de alongar a lombar ao final do dia.'
),
(
  18, 1, 'Batata Doce', 'sweet_potato', 14.2, 230,
  'A mielinização dos nervos acelera a transmissão de impulsos cerebrais. Os ciclos de sono e vigília se tornam regulares.',
  'A pressão arterial costuma cair um pouco no segundo trimestre, podendo causar tontura ao levantar rápido.',
  'Ao se levantar da cama, vire primeiro de lado antes de sentar para proteger sua musculatura abdominal.'
),
(
  19, 1, 'Manga Palmer', 'mango', 15.3, 280,
  'O vérnix caseoso, uma camada protetora esbranquiçada e aveludada, envolve a pele do bebê.',
  'A linha nigra pode começar a escurecer no meio do abdômen, assim como as aréolas mamárias.',
  'Hidrate a pele com óleos vegetais puros (como óleo de amêndoas ou semente de uva) com massagens suaves.'
),
(
  20, 1, 'Banana Nanica', 'banana', 25.6, 330,
  'Metade do caminho! O bebê mede da cabeça aos calcanhares. As meninas já têm todos os óvulos formados.',
  'O fundo do útero atinge a altura da cicatriz umbilical. Movimentos fetais tornam-se nítidos e frequentes.',
  'Convide seu parceiro ou parceira para colocar as mãos na barriga e sentir os chutinhos do bebê.'
),
(
  21, 1, 'Cenoura Grande', 'carrot', 26.7, 390,
  'As sobrancelhas e pálpebras estão bem definidas. O bebê engole líquido amniótico praticando a digestão.',
  'Podem surgir cãibras noturnas nas panturrilhas e pernas.',
  'Alongue os pés para cima antes de dormir e garanta uma boa ingestão de magnésio e água.'
),
(
  22, 1, 'Mamão Papaya', 'papaya', 27.8, 460,
  'Os sentidos estão em pleno desenvolvimento: tato, audição, paladar e propriocepção se aprimoram.',
  'Sensação de calor excessivo e transpiração devido ao metabolismo materno acelerado.',
  'Prefira tecidos naturais como algodão e linho e mantenha-se em ambientes frescos e ventilados.'
),
(
  23, 1, 'Beringela', 'eggplant', 28.9, 540,
  'O bebê responde a estímulos externos, como músicas altas e toques carinhosos na parede uterina.',
  'Podem ocorrer as primeiras contrações indolores de treinamento (Braxton Hicks).',
  'Ao sentir a barriga endurecer sem dor, mude de posição, beba um copo de água e relaxe o quadril.'
),
(
  24, 1, 'Espiga de Milho', 'corn', 30.0, 630,
  'Os pulmões produzem surfactante, substância essencial para evitar o colapso dos alvéolos ao respirar ar.',
  'Período padrão para o rastreio do diabetes gestacional (teste de tolerância à glicose oral).',
  'Faça os exames laboratoriais no tempo correto e converse abertamente sobre quaisquer receios com sua equipe.'
),
(
  25, 1, 'Couve-Flor', 'cauliflower', 34.6, 730,
  'A estrutura óssea do bebê se fortalece a cada dia e a cor do cabelo começa a ser definida geneticamente.',
  'A azia e o refluxo podem surgir com a compressão do estômago pelo crescimento uterino.',
  'Evite líquidos durante as refeições, evite deitar logo após comer e durma com a cabeceira levemente elevada.'
),
(
  26, 1, 'Alface Americana', 'lettuce', 35.6, 820,
  'Os olhos do bebê começam a se abrir gradualmente e ele já consegue piscar em resposta à luz.',
  'Aumento do inchaço nos pés e tornozelos ao final da tarde.',
  'Eleve as pernas por 20 minutos com os pés apoiados na parede para estimular o retorno venoso.'
),
(
  27, 1, 'Abóbora Cabotiá', 'kabocha', 36.6, 920,
  'O bebê já tem soluços regulares, sentidos como pulsações rítmicas e suaves na barriga.',
  'Fim do segundo trimestre. A capacidade pulmonar materna adapta-se ao espaço reduzido.',
  'Exercícios de relaxamento e visualizações guiadas fortalecem sua confiança para o trabalho de parto.'
),
(
  28, 3, 'Beringela Grande', 'large_eggplant', 37.6, 1050,
  'Início do terceiro trimestre! O bebê começa a virar de cabeça para baixo (apresentação cefálica).',
  'O peso da barriga pode causar dor no ligamento redondo e desconforto na bacia.',
  'Monitore os movimentos do bebê diariamente: ele deve se mexer ativamente várias vezes ao dia.'
),
(
  29, 3, 'Abóbora Butternut', 'butternut_squash', 38.6, 1200,
  'O cérebro assume o controle regular da respiração térmica e do controle postural.',
  'Dificuldade para encontrar uma posição confortável para dormir. Dormir virada para o lado esquerdo é ideal.',
  'Use travesseiros entre os joelhos e sob a barriga para alinhar a coluna e a bacia confortavelmente.'
),
(
  30, 3, 'Repolho Verde', 'cabbage', 39.9, 1380,
  'A quantidade de líquido amniótico atinge o volume máximo para que o bebê continue se exercitando.',
  'As articulações pélvicas afrouxam sob a ação da relaxina, preparando a passagem do parto.',
  'A bola suíça de pilates é perfeita para fazer círculos suaves com a bacia e aliviar a pressão sacral.'
),
(
  31, 3, 'Coco Seco', 'coconut', 41.1, 1570,
  'O bebê consegue virar a cabeça de um lado para o outro e acumula reservas importantes de ferro e cálcio.',
  'Sensação de falta de ar leve quando o bebê empurra o diafragma.',
  'Mantenha a postura ereta e respire profundamente pelas costelas, expandindo a caixa torácica lateralmente.'
),
(
  32, 3, 'Couve Chinesa', 'chinese_cabbage', 42.4, 1780,
  'As unhas dos pés e das mãos já chegam às pontas dos dedos. O bebê pratica a respiração continuamente.',
  'Pode haver saída de algumas gotas de colostro pelos mamilos, o primeiro leite materno.',
  'Não esprema as mamas. O colostro é produzido naturalmente e estará pronto no momento do nascimento.'
),
(
  33, 3, 'Abacaxi', 'pineapple', 43.7, 2000,
  'O crânio do bebê permanece flexível e móvel para facilitar a passagem suave pelo canal de parto.',
  'Aumento da sensibilidade emocional e do instinto de ninho (vontade de arrumar tudo para a chegada).',
  'Canalize a energia do ninho com equilíbrio, sem esgotar suas energias físicas. Descanse sempre que puder.'
),
(
  34, 3, 'Melão Cantaloupe', 'cantaloupe', 45.0, 2220,
  'O sistema imunológico do bebê recebe anticorpos preciosos da mãe através da placenta.',
  'A pressão pélvica aumenta. A necessidade de ir ao banheiro à noite torna-se mais frequente.',
  'Converse com sua doula sobre as posições verticais e ativas para o alívio das dores no trabalho de parto.'
),
(
  35, 3, 'Melão Amarelo', 'honeydew', 46.2, 2450,
  'A maior parte do desenvolvimento físico básico está completa; agora o foco é ganho de peso e maturação.',
  'A barriga pode descer um pouco à medida que o bebê começa a encaixar na pelve materna.',
  'Comemore: a respiração fica mais leve quando a barriga desce! É um lindo sinal da aproximação do parto.'
),
(
  36, 3, 'Mamão Formosa', 'papaya_large', 47.4, 2700,
  'O bebê ganha cerca de 25 a 30 gramas por dia. A lanugem quase desapareceu por completo.',
  'A partir de agora as consultas de pré-natal tornam-se semanais.',
  'Deixe a mala da maternidade e os documentos organizados e revise o plano de parto com sua equipe.'
),
(
  37, 3, 'Acelga Roxa', 'swiss_chard', 48.6, 2950,
  'A termo precoce! Se nascer agora, os órgãos do bebê já funcionam de maneira independente e madura.',
  'O tampão mucoso pode começar a se soltar em pequenos pedaços gelatinosos (rosados ou amarronzados).',
  'A perda do tampão mucoso indica que o colo do útero está se preparando, mas o parto pode levar dias ainda.'
),
(
  38, 3, 'Alho-Poró Grande', 'leek', 49.8, 3200,
  'O bebê engole e elimina cerca de 500 ml de líquido amniótico por dia, fortalecendo rins e bexiga.',
  'As contrações de treinamento ficam mais frequentes e podem ser sentidas no baixo ventre e nas costas.',
  'Diferencie trabalho de parto: contrações verdadeiras ganham ritmo regular, intensidade crescente e não passam.'
),
(
  39, 3, 'Melancia Pequena', 'mini_watermelon', 50.7, 3400,
  'O cordão umbilical é revestido pela gelatina de Wharton para garantir fluxo constante de oxigênio.',
  'Ansiedade natural pela chegada do grande momento. Expectativa dos familiares e amigos.',
  'Proteja sua bolha de ocitocina. Diminua o tempo no celular, receba massagens carinhosas e foque no presente.'
),
(
  40, 3, 'Abóbora Moranga', 'pumpkin', 51.5, 3600,
  'Data Provável do Parto (DPP)! Apenas 5% dos bebês nascem exatamente nesta data; nascer até 42 semanas é normal.',
  'O colo do útero amolece e dilata sutilmente. A mulher se prepara física e psicologicamente para o parto.',
  'Confie no tempo perfeito do seu bebê e no poder de sabedoria do seu corpo. Respire e acolha cada momento.'
),
(
  41, 3, 'Jaca Média', 'jackfruit', 52.0, 3750,
  'A termo tardio. A equipe de saúde monitora o bem-estar fetal através de cardiotocografia e ultrassom.',
  'Cansaço físico e grande expectativa. O corpo continua nutrindo o bebê com perfeição.',
  'Mantenha contato próximo com sua doula e seu médico para acompanhamento cuidadoso e tranquilo da vitalidade fetal.'
),
(
  42, 3, 'Melancia Grande', 'watermelon', 52.5, 3900,
  'Limite do acompanhamento gestacional a termo. A equipe avalia métodos naturais ou médicos de indução.',
  'Avaliação contínua do colo uterino e do volume de líquido amniótico.',
  'Independentemente da via de nascimento ou necessidade de indução, seu protagonismo e amor permanecem soberanos.'
);
