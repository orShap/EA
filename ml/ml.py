import pandas as pd
from sklearn.model_selection import train_test_split
data = pd.read_csv('ml.csv')
print data.head()

y = pd.DataFrame(data={'labalA': data.labalA, 'labalB': data.labalB, 'labalC': data.labalC })
x = data.drop(columns=['labalA', 'labalB', 'labalC'])

x_train, x_test, y_train, y_test = train_test_split(x, y,test_size=0.2)
print "\nX_train:\n"
print(x_train.head())
print x_train.shape
print "\nX_test:\n"
print(x_test.head())
print x_test.shape


from skmultilearn.adapt import MLkNN
from sklearn.metrics import accuracy_score
from scipy.sparse import csr_matrix, lil_matrix
classifier = MLkNN(k=3)
# Note that this classifier can throw up errors when handling sparse matrices.
x_train = lil_matrix(x_train).toarray()
y_train = lil_matrix(y_train).toarray()
x_test = lil_matrix(x_test).toarray()
classifier.fit(x_train, y_train)							# train
predictions = classifier.predict(x_test)					# predict
print("Accuracy = ", accuracy_score(y_test,predictions)) 	# accuracy

